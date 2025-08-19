---
layout: post
title:  "Is Noiseless FHE Even Possible?"
date:   2025-08-19 00:00:00 -0600
categories: cryptography
mathjax: true
---

A couple of years ago, I was at a cryptography conference for work. There were
folks working on all kinds of exciting things, but I found myself in a long
conversation with a fellow compiler engineer that happened to be working on
systems for fully homomorphic encryption (FHE). While the term is rather fancy,
the idea is pretty simple to understand, which is why it's one of those things
that I turn over and over again in my head from time to time. Typically when
using encryption, one can translate data to and from an encrypted form, so that
it's hard for somebody else to learn what the original data is just by looking
at its encrypted version. Unfortunately, because the encryption obscures the
data, you can't use that data in any way without first decrypting it. The whole
idea of homomorphic encryption is to be able to do computations on this data in
its encrypted form, with the idea being that even somebody you want to keep a
secret from can do computations for you on your private data, and learn nothing
about your secrets, or even the results of the computations they're doing for
you in the process. Seems like a neat idea, but it feels a bit far-fetched,
right? Well, this is possible _today_, and its getting more and more practical
all the time thanks to hard-working cryptographers and compiler engineers.

Now let's make the a bit more precise. An "ordinary" encryption scheme has three
parts: a procedure to generate a _secret key_ that is necessary to encrypt and
decrypt data, and then of course the actual procedures to do the actual
_encrypting_ and _decrypting_. The original data we call a _plaintext_, and the
encrypted data we call a _ciphertext_. There are encryption schemes that use
different keys for encryption and decryption, called asymmetric- or public-key
encryption, but for simplicity we'll only discuss symmetric encryption here. If
we denote the type of plaintexts as $$P$$, the type of ciphertexts as $$C$$, the
type of secret keys as $$\mathit{SK}$$, and some generic probability space
$$\Omega$$, then an encryption scheme is a set of functions with the following
signatures:

$$
\mathrm{keygen} : \mathbb{1}^\lambda \times \Omega \rightarrow \mathit{SK} \\
\mathrm{encrypt} : \mathit{SK} \times P \times \Omega \rightarrow C \\
\mathrm{decrypt} : \mathit{SK} \times C \rightarrow P
$$

In this definition, the $$\mathrm{keygen}$$ function takes as input the
_security parameter_ for the scheme, which is a measure of how computationally
difficult it should be to break the scheme. The strange notation is sort of a
theoretical footnote, but it's worth a bit of explanation. All three of these
functions should run in time bounded by some polynomial of $$\lambda$$, and so
it's actually important that the input to $$\mathrm{keygen}$$ have size
proportional to $$\lambda$$. It's at best ambiguous what the size of the input
is with a plain integer, so instead we explicitly encode it as the string of 1's
repeated $$\lambda$$ times. Note that the higher the security parameter is, the
more secure the scheme is, but also the more expensive it is to perform the
basic operations — there's a real tradeoff here, and in practice one chooses the
security parameter based on the particulars of the situation.

It's also important to note the role that randomness plays here: the
$$\mathrm{keygen}$$ ultimately returns one out of many possible secret keys, so
it uses randomness to pick one at random; similarly, any particular plaintext
might have many possible ciphertexts, and so $$\mathrm{encrypt}$$ is similarly
randomized. To that end, each one takes an additional parameter capturing the
"randomness," so that they are well-defined functions. For convenience,
cryptographers often use a shorthand for using randomized functions, so that the
random data that's passed in doesn't need to be tracked explicitly. That is,
instead of writing "for some $$\omega$$ sampled from $$\Omega$$, let
$$y \coloneqq \mathrm{encrypt}(sk, m, \omega)$$," we simply write
$$y \leftarrow \mathrm{encrypt}(sk, m)$$. Lastly, to have a usable scheme, we
need decryption to "actually work," so we require a property called
_correctness_, which states that decrypting an encrypted message always gives
back the original message:

$$
\mathrm{decrypt}(sk, \mathrm{encrypt}(sk, m)) = m
$$

This is well and good, but it would include very silly encryption schemes like
encrypting any message to itself. Clearly that provides no security whatsoever,
since anybody could read the "encrypted" messages and know exactly what the
contents are without knowing the secret key! To prevent this frivolity, we also
like our encryption schemes to be "secure" in some sense of the word. It turns
out there are a lot of different senses of the word, but one relatively common
working definition is that of _semantic security_: no adversary with reasonable
computational resources (i.e. in probabilistic polynomial time) given an
arbitrary ciphertext can decide any property of the plaintext that wasn't
already clear from just the message size and basic information about the
encryption scheme itself. Typically, to prove that a scheme is semantically
secure, one would use a different formulation in terms of an adversary
distinguishing ciphertexts, but we won't be too concerned about the details here,
so I'll skip an equational definition.


## Adding in Homomorphisms

The things we've talked about so far have been around for a long time already,
and there are lots of well studied encryption schemes out there. Unfortunately,
there's not a lot you can do with ciphertexts in a good old-fashioned encryption
scheme besides store and transmit them. If you want to do any _computation_ on
them, you'll need to decrypt and possibly re-encrypt them after, which can only
be done by someone you trust with your data. A homomorphic encryption scheme
lets you actually do computations on the encrypted data, without knowing what
the encrypted data actually is. For example, in RSA the product of two
ciphertexts is also the encryption of the product of their plaintexts. Writing
this equationally, this has a really simple structure, where encryption sort of
"distributes" over the plaintext operation, which is precisely the mathematical
notion of homomorphism (hence the name).

$$
\forall m_1, m_2 : P,
\mathrm{encrypt}(sk, m_1) \cdot \mathrm{encrypt}(sk, m_2)
= \mathrm{encrypt}(sk, m_1 \cdot m_2 \bmod n)
$$

The authors of RSA were aware of this fact, and shortly after the original
publication of the algorithm in 1977, two of the original authors and Michael
Dertouzos published another paper exploring what sorts of _privacy homomorphisms_
might be possible <a href="#cit1">[1]</a>. This planted the seed for fully
homomorphic encryption, which takes this idea a few steps further by supporting
multiple homomorphic operations that can be freely composed to implement more
interesting models of computation. It wasn't until 2009 that Craig Gentry built
the first workable FHE scheme <a href="#cit2">[2]</a>, which supported arbitrary
addition and multiplication of ciphertexts. This scheme was novel in a few ways:
unlike a lot of other encryption schemes, it encrypts the plaintext _with some gaussian noise_
such that as long as the noise is below some threshold, the decryption will be
correct. Then, the privacy homomorphisms of addition and multiplication work as
expected, except that they also increase the noise of the resulting ciphertext.
This gives a scheme that works for a few operations, until the noise grows past
the bound and decryption no longer works. It's possible to reduce the noise on a
ciphertext by decrypting and re-encrypting it, and so a naive solution would be
to send it back to the owner and get a "fresh one" back. However, Gentry also
realized that if the scheme can homomorphically evaluate its own decryption
program, this achieves the same effect without the intervention of the first
party. This technique is called _bootstrapping_, and it makes it possible to
perform arbitrarily large encrypted computations. The big drawback is that
bootstrapping is really expensive. A single bootstrapping operation may involve
performing thousands or even millions of homomorphic addition or multiplication
operations.

Since then, many new FHE schemes have been designed using this noise and
bootstrapping strategy, with substantial improvements in concrete efficiency —
I'll specifically mention BGV, BFV, TFHE, FHEW, and CKKS all fall in this
category. In fact, all major FHE libraries I'm familiar with implement some
subset of these 5 schemes. In all cases, bootstrapping remains the main
bottleneck of these systems despite considerable acceleration over the years.
This left me wondering: can we just cut out the noise altogether, and eliminate
bootstrapping completely?


## Noiseless FHE

I suspect that since research on noise-based approaches has yielded progressively
faster schemes with provable security under standard cryptographic assumptions,
noiseless FHE is somewhat underexplored. I've been able to find only a handful
of papers, mostly preprints (i.e. not peer reviewed), discussing the possibility.
The challenge with noiseless FHE is that there have to be actual homomorphisms
between the spaces of plaintexts and ciphertexts, which means that you can often
learn something about the plaintexts from the ciphertexts and operations on them.
This is the approach taken by Gjøsteen and Strand in <a href="#cit5">[5]</a>,
which gives us a few clean impossibility results. For example, in the relatively
rich structure of a vector space, it's not too hard to see that there are no
secure noiseless FHE schemes: any homomorphism between vector spaces is a linear
map, and so decryption is equivalent to multiplying the ciphertext by some
matrix:

$$ p = \mathrm{decrypt}(sk, c) = Dc $$

Therefore, if the vector space of plaintexts has dimension $$n$$ and the vector
space of ciphertexts has dimension $$m$$, then one can reconstruct the matrix
$$D$$ from $$nm$$ pairs of known plaintexts and ciphertexts where the ciphertexts
are linearly independent, so no such scheme can be secure. This proof is theorem
3 in <a href="#cit5">[5]</a>.

Fields are a slightly less complicated algebraic structure, at least in that
vector spaces are always defined over a field. So even though a noiseless FHE
scheme for a vector space can't be secure, maybe one for a field can?
Unfortunately, no. It is a beautiful theorem of field theory that all finite
fields of the same size are _isomorphic_, meaning that any such fields only have
their elements shuffled, but are structurally the same. There are also fast
algorithms for converting finite fields into a canonical form, and so no such
scheme can be secure. Now, maybe the ciphertext field could be larger than the
plaintext one. To have a homomorphism between the fields, they must have the
same _characteristic_, which for finite fields means that they are extensions of
the same prime field. But polynomials over a field are also a vector space,
which we also know is insecure. This proof is theorem 4 in <a href="#cit5">[5]</a>.

So we have these two "impossibility results" for vector spaces and fields. But
then on the simpler side of algebraic structures, we've already seen that there are
secure homomorphic encryption schemes for groups like RSA, but these are really
limited in the computations that they can express. I would guess there are also
secure homomorphic encryption schemes for even simpler structures like monoids
or even magmas. Then in the middle there's uncharted territory, where there are
other algebraic structures where we don't know one way or the other: rings and
modules fall into this bucket, but Gjøsteen and Strand were unable to answer the
question one way or the other.


## A failed scheme for rings

There have been several attempts to construct an FHE scheme for rings. One
attempt from Li and Wang is particularly simple in its construction <a href="#cit4">[4]</a>.
Unfortunately, it is also definitely insecure <a href="#cit5">[5]</a>, but
together these two facts make it an interesting example to study. First, some
exposition on rings: historically, the study of rings grew out of the study of
polynomials, and so they have at their core the basic operations under which
polynomials are _closed_, namely addition and multiplication. You can also
subtract polynomials to obtain another polynomial and so addition is invertible,
but in general dividing two polynomials does not give another polynomial so
multiplication is not always invertible. There are other interesting structures
besides polynomials that share many of the same properties, like matrices and
functions over certain other structures, where multiplication is not commutative.
Thus, it has been useful to talk about both _commutative_ and _noncommutative_
rings, which gives us the modern definition. The "canonical" examples of
commutative rings are the integers and polynomials. The "canonical" example of a
non-commutative ring is the set of matrices with entries from some other ring
like the real numbers. A ring is a set $$R$$ with binary operations $$+$$
(addition) and $$\cdot$$ (multiplication), satisfying the following axioms (taken
from Wikipedia):

1. Addition is associative: $$a + (b + c) = (a + b) + c$$
2. Addition is commutative: $$a + b = b + a$$
3. There is an additive identity, $$0$$, such that $$a + 0 = a$$
4. There is an additive inverse for each element, $$-a$$, such that $$a + (-a) = 0$$
5. Multiplication is associative: $$a \cdot (b \cdot c) = (a \cdot b) \cdot c$$
6. There is a multiplicative identity, $$1$$, such that $$a \cdot 1 = 1 \cdot a = a$$
7. Multiplication left-distributes over addition: $$a \cdot (b + c) = a \cdot b + a \cdot c$$
8. Multiplication right-distributes over addition: $$(b + c) \cdot a = b \cdot a + c \cdot a$$

Li and Wang's construction starts with a noncommutative ring $$R$$. The secret
key is a 3x3 invertible matrix over $$R$$, which we call $$H$$. The
$$\mathrm{keygen}$$ function selects such a matrix. To encrypt, we take the
plaintext $$m \in R$$ and construct a 3x3 upper triangular matrix, padded by
random elements $$b, c, d, e, f \in R$$ as follows:

$$ A = \begin{bmatrix}
    m & b & c \\
    0 & d & e \\
    0 & 0 & f \\
\end{bmatrix} $$

Then encryption and decryption are computed by "conjugating" by the secret key,
and for decryption this puts the plaintext in the top left corner of the matrix.

$$ C = HAH^{-1} $$

$$ m = (H^{-1}CH)_{0,0} $$

It's straightforward to verify correctness:

$$
\begin{aligned}
\mathrm{decrypt}(sk, \mathrm{encrypt}(sk, m, \omega))
    &= \mathrm{decrypt}(sk, HAH^{-1}) \\
    &= (H^{-1}HAH^{-1}H)_{0,0} \\
    &= A_{0,0} \\
    &= m
\end{aligned}
$$

As well as that addition and multiplication are homomorphic, noting that the sum
and product of the $$A_i$$ matrices has the sum and product of the top left
entries in the right spot. Equationally, we can see:

$$
\begin{aligned}
\mathrm{encrypt}(sk, m_1, \omega_1) + \mathrm{encrypt}(sk, m_2, \omega_2)
    &= HA_1H^{-1} + HA_2H^{-1} \\
    &= H(A_1 + A_2)H^{-1} \\
    &= \mathrm{encrypt}(sk, m_1 + m_2, \omega')
\end{aligned}
$$

$$
\begin{aligned}
\mathrm{encrypt}(sk, m_1, \omega_1) \cdot \mathrm{encrypt}(sk, m_2, \omega_2)
    &= (HA_1H^{-1}) \cdot (HA_2H^{-1}) \\
    &= H(A_1 \cdot A_2)H^{-1} \\
    &= \mathrm{encrypt}(sk, m_1 \cdot m_2, \omega')
\end{aligned}
$$

The security of this scheme relies on the randomized entries included in the
$$A$$ matrix during encryption and the secrecy of the secret key to obscure the
relationship between the message $$m$$ and the ciphertext $$C$$. If this scheme
used a matrix over a field, it would be insecure for the same reason that schemes
over vector spaces are insecure: with enough pairs of plaintexts and ciphertexts,
the linear mapping between plaintexts and ciphertexts can be recovered using
standard techniques from linear algebra, revealing the key.


## An old attack on the Li-Wang 2015 scheme

Gjøsteen and Strand specifically address this scheme in the same preprint as their
impossibility results <a href="#cit5">[5]</a>, which was very convenient for me
because I actually read the Li-Wang paper first. Their attack doesn't recover the
secret key or allow decryption of arbitrary ciphertexts, but they do show that
ciphertexts reveal _something_ about their messages. In particular, by checking
whether the ciphertext matrix is invertible or not, we can make a better guess
about the true value of the ciphertext than we could otherwise.

Specifically, since $$C = HAH^{-1}$$, it is the case that $$C$$ is invertible if
and only if $$A$$ is invertible. Since $$A$$ is an upper triangular matrix, if
it is invertible then none of the values on its diagonal can be 0. When working
with matrices over a field, this relationship is exact: any zeros on the diagonal
make the matrix non-invertible, but in the case of our non-commutative ring
$$R$$ this is test is inconclusive. In this way, we have a better-than-random
guess when trying to distinguish an encryption of 0 from an encryption of 1.
Indeed, more generally this strategy lets us distinguish _units_ from _non-units_,
which refers to whether or not an element of $$R$$ has a multiplicative inverse.

We can also improve this strategy if we know any non-trivial encryptions of $$0$$,
meaning that the encryption isn't just the 0 matrix. If $$C_0$$ is such a
ciphertext, then by additive homomorphism $$C + C_0$$ is an encryption of the
same value and we can check if that matrix is invertible as well. If either of
the encryptions are invertible, then $$C$$ must be the encryption of a unit, and
if both of them are non-invertible then it's more likely that $$C$$ is an
encryption of a non-unit. In this way, with many encryptions of zero we can
repeat the process and become even more confident in our guess.

As a practical note, it's relatively straightforward to generate new encryptions
of zero as long as you know a nontrivial one. For example, given an encryption
of zero $$C_0$$ and any other ciphertext $$C$$, it must be that $$C \cdot C_0$$
is also an encryption of zero. Furthermore, the sum of any two encryptions of
zero is also an encryption of zero, like $$C_0 + C_0$$. These two facts together
make the encryptions of zero a special subset called a _left ideal_ of the set
of all ciphertexts. In fact, even though multiplication isn't commutative, we
also have that $$C_0 \cdot C$$ is an encryption of zero, and so this particular
ideal is a _two-sided ideal_. Note that this isn't specific to this particular
FHE scheme, but a general property of all ring homomorphisms.


## A new attack on the Li-Wang 2015 scheme

While the attack in the previous section is good enough that nobody should ever
seriously consider using this scheme, I wondered if it was possible to do any
better. Gjøsteen and Strand's attack lets us distinguish many pairs of
ciphertexts with reasonably high accuracy, but I had this nagging feeling that
the ciphertexts leak more information than that. After all, we're doing linear
operations on a relatively small module, so surely there's something in the
linear algebra toolbox that lets us recover the encryption key $$H$$.

After poking at the problem for a while, I realized that the zero entries in the
$$A$$ matrix creates a fun mathematical coincidence. First, let's rewrite the
encryption equation slightly:

$$ C = HAH^{-1} \Longleftrightarrow CH = HA $$

And if we expand out the matrices, the structure becomes a bit more apparent:

$$
\begin{bmatrix}
    c_{0,0} & c_{0,1} & c_{0,2} \\
    c_{1,0} & c_{1,1} & c_{1,2} \\
    c_{2,0} & c_{2,1} & c_{2,2} \\
\end{bmatrix}
\begin{bmatrix}
    h_{0,0} & h_{0,1} & h_{0,2} \\
    h_{1,0} & h_{1,1} & h_{1,2} \\
    h_{2,0} & h_{2,1} & h_{2,2} \\
\end{bmatrix}
=
\begin{bmatrix}
    h_{0,0} & h_{0,1} & h_{0,2} \\
    h_{1,0} & h_{1,1} & h_{1,2} \\
    h_{2,0} & h_{2,1} & h_{2,2} \\
\end{bmatrix}
\begin{bmatrix}
    m & b & c \\
    0 & d & e \\
    0 & 0 & f \\
\end{bmatrix}
$$

We don't know the entries $$b, c, d, e, f$$ of $$A$$, but if we know $$m$$ then
we at least know its entire first column. We can drop the last two columns on
each side of our equation and multiply through to obtain something that looks
like an eigenvector equation where the first column of $$H$$ is the eigenvector
and $$m$$ is the eivenvalue, except that multiplication is noncommutative and
the eigenvalue is on the wrong side.

$$
\begin{bmatrix}
    c_{0,0} & c_{0,1} & c_{0,2} \\
    c_{1,0} & c_{1,1} & c_{1,2} \\
    c_{2,0} & c_{2,1} & c_{2,2} \\
\end{bmatrix}
\begin{bmatrix}
    h_{0,0} \\
    h_{1,0} \\
    h_{2,0} \\
\end{bmatrix}
=
\begin{bmatrix}
    h_{0,0} & h_{0,1} & h_{0,2} \\
    h_{1,0} & h_{1,1} & h_{1,2} \\
    h_{2,0} & h_{2,1} & h_{2,2} \\
\end{bmatrix}
\begin{bmatrix}
    m \\
    0 \\
    0 \\
\end{bmatrix}
=
\begin{bmatrix}
    h_{0,0}m \\
    h_{1,0}m \\
    h_{2,0}m \\
\end{bmatrix}

=
\begin{bmatrix}
    h_{0,0} \\
    h_{1,0} \\
    h_{2,0} \\
\end{bmatrix} m
$$

Nevertheless, multiplication commutes with 0 or 1. Going forward, let's suppose
that $$m = 1$$, and let $$H_{i,0}$$ be the first column of $$H$$. Now we can
write this more compactly as

$$
 CH_{i,0} = H_{i,0} \Longleftrightarrow (C - I) H_{i,0} = 0
$$

In the language of linear algebra, this equation says that the first column of
$$H$$ is in the nullspace of the matrix $$C - I$$. Interestingly, since the
matrix $$H$$ is invertible, we know that none of its columns can be all zeros,
so it must be the case that $$C - I$$ has a nontrivial nullspace, and therefore
is itself not invertible. If the ring $$R$$ is small enough, at this point it
may be feasible to simply run an exhaustive search of all $$\left|R\right|^3$$
possible vectors to find candidates for $$H_{i,0}$$ (a much smaller search space
than the full ~$$\left|R\right|^9$$ possible secret keys). If R is large, we can
use gaussian elimination on $$C - I$$ to shrink the seach space even more. The
main "gotcha" with doing this to a matrix over a noncommutative ring instead of
a field is that it isn't always possible to divide, so scaling a row of the
matrix can only be done by factors that are units of $$R$$. Anyway, $$C - I$$
should reduce to a matrix of the following form, which gives two simple-looking
but tricky equations.

$$
\begin{bmatrix}
    \alpha & 0 & \beta \\
    0 & \gamma & \delta \\
    0 & 0 & 0 \\
\end{bmatrix}
\Longrightarrow
\begin{cases}
\alpha \cdot h_{0,0} = \beta \cdot h_{2,0} \\
\gamma \cdot h_{1,0} = \delta \cdot h_{2,0}
\end{cases}
$$

These equations independently describe the values of $$h_{0,0}$$ and $$h_{1,0}$$
in terms of the free variable $$h_{2,0}$$. We know that the first column of the
secret key matrix satisfies these equations, so any satisfying assignment might
be the correct answer. Since we can now solve for $$h_{0,0}$$ and $$h_{1,0}$$
independently, we've reduced the amount of work for an exhaustive search from
$$O(\left|R\right|^3)$$ to $$O(\left|R\right|^2)$$. Up to this point, we've only
assumed that we can do ring operations and determine if an element of the ring
is a unit or not. Unfortunately, to make any more progress for "large" $$R$$, we
need to find nontrivial solutions (i.e. not $$(0, 0)$$) to equations of the
following form, which essentially requires knowing more about the structure of
$$R$$:

$$ \alpha \cdot x = \beta \cdot y $$

Notably, there is one special case that seems to be relatively rare: if either
$$\alpha$$ or $$\beta$$ is a unit of $$R$$ (without loss of generality, suppose
$$\beta$$ is a unit), then the satisfying assignments can be enumerated in
$$O(\left|R\right|)$$ by trying all possible values of $$x$$, and computing the
corresponding value of $$y$$ as

$$ y = \beta^{-1} \cdot \alpha \cdot x $$

In my practical experiments in breaking this system, I only worked with choices
of $$R$$ that were matrix rings over $$\mathbb{Z}/q\mathbb{Z}$$ (the integers
mod $$q$$), where it's relatively easy to use the "substructure" of the elements
to find solutions. For example, with $$R = M_2(\mathbb{F}_2)$$:

$$
\begin{bmatrix}
    1 & 0 \\
    0 & 0 \\
\end{bmatrix} \cdot x
= 
\begin{bmatrix}
    0 & 1 \\
    0 & 0 \\
\end{bmatrix} \cdot y
$$

We can "expand" our variables and see what multiplying by those fixed matrices do:

$$
\begin{bmatrix}
    1 & 0 \\
    0 & 0 \\
\end{bmatrix} \cdot
\begin{bmatrix}
    a & b \\
    c & d \\
\end{bmatrix}
=
\begin{bmatrix}
    a & b \\
    0 & 0 \\
\end{bmatrix}
$$

$$
\begin{bmatrix}
    0 & 1 \\
    0 & 0 \\
\end{bmatrix} \cdot
\begin{bmatrix}
    e & f \\
    g & h \\
\end{bmatrix}
=
\begin{bmatrix}
    g & h \\
    0 & 0 \\
\end{bmatrix}
$$

Those products are equal if and only if $$a = g$$ and $$b = h$$, so the choice of
$$x$$ fixes two of the entries in $$y$$, leaving two entries free. This leaves a
total of four possible values of $$y$$ for each of the 16 choices of $$x$$, for
a total of 64 solutions. We can write the general form of solutions in terms of
six free binary variables:

$$
(x, y) =
\left(
\begin{bmatrix}
    a & b \\
    c & d \\
\end{bmatrix},
\begin{bmatrix}
    e & f \\
    a & b \\
\end{bmatrix}
\right)
$$

This general approach works as long as the elements of $$R$$ can be split up
into smaller structures that are easier to reason about — in this case, the
noncommutative ring $$R$$ is a matrix ring over a smaller commutative ring,
which makes it easy to quickly find all solutions. The strategy can be described
in more general terms using the language of _ideals_ which we talked about in
the last section: the subset of elements in $$R$$ that can be written as
$$\alpha \cdot x$$ form a right ideal. To see that this subset is closed under
addition, observe that
$$\alpha \cdot x_1 + \alpha \cdot x_2 = \alpha \cdot (x_1 + x_2)$$, and to see
that it is closed under right multiplication by ring elements, observe that
$$(\alpha \cdot x_1) \cdot r = \alpha \cdot (x_1 \cdot r)$$. For convenience,
these right ideals are often denoted $$\alpha R$$. To solve our equation, we can
consider general elements of the ideals $$\alpha R$$ and $$\beta R$$, set them
equal to each other, and solve the resulting equations over the substructures
that make up these elements of $$R$$.

At this point, we've narrowed down the value of $$H_{i,0}$$ to some small set of
vectors. We can now take a second known plaintext-ciphertext pair $$(m', C')$$,
and for each vector in our candidate set we can check again:

$$ C' H_{i,0} = H_{i,0} m' $$

Note that in this case, we actually have no unknowns. For each candidate value
of $$H_{i,0}$$, we can directly compute both sides and reject a candidate if the
equation isn't satisfied. In practice, this usually wittled down the candidate
list very fast, but sometimes multiple pairs were necessary. Again working with
$$R = M_3(\mathbb{F}_2)$$, in a handful of trials I never needed more than two
additional pairs to get to a single candidate (which was correct).

Once we have our definitive value of $$H_{i,0}$$, this is sufficient to decrypt
any ciphertext: using the same formula as before, we now have three equations
with a single unknown $$m'$$. The left side of the equation evaluates to a vector
of three elements, and so we end up with a system of three equations. The same
ideal-based strategies we used on the other equations can also be used to solve
these.

$$
\begin{cases}
n_0 = h_{0,0} \cdot m' \\
n_1 = h_{1,0} \cdot m' \\
n_2 = h_{2,0} \cdot m' \\
\end{cases}
$$

From the look of it, it would seem plausible that there could be multiple
solutions to these equations. Although I haven't proven it's impossible, I
haven't seen that occur in my experiments. With that, we have completely broken
the security of the scheme: with as few as two known plaintext-ciphertext pairs,
we are able to recover sufficient information about the secret key to decrypt
any message. It was previously known how to distinguish ciphertexts with
non-negligible advantage, as far as I know this is the most complete break of
this encryption scheme so far.


## Looking towards the future

So what have we learned? Notably, we've introduced the fundamental concept of
fully homomorphic encryption. We've talked a little bit about noise-based FHE
schemes and why noise-free schemes would be game changing. We also covered some
impossibility results for noise-free schemes, and looked at a particularly simple
proposal for a noise-free FHE scheme. Unfortunately, we also showed that this
scheme is insecure. After looking into this scheme in so much detail, I'm curious
what other proposals are out there. Most of the papers I looked at were close to
10 years old at this point, so it's possible that somebody made substantial
progress on the problem or proved more impossibility results I'm not aware of
along the way.

For example, there seem to be some interesting theoretical leads in constructing
FHE schemes. One promising avenue would be to construct a homomorphic encryption
scheme for a non-commutative group — note that there are already additively and
multiplicatively homomorphic encryption schemes, but those operations are
commutative. It would be possible to encode bitwise NAND into such a group, which
could then be used to evaluate arbitrary boolean circuits homomorphically
<a href="#cit3">[3]</a>. It also seems the same authors Li and Wang proposed
another scheme in this vein two years later <a href="#cit6">[6]</a>. Maybe that's
what I'll look at next?

<label id="cit1">[1]</label> Ron Rivest, Len Adleman, and Michael Dertouzos. _On Data Banks and Privacy Homomorphisms_. Foundations of Secure Computation, 1978.

<label id="cit2">[2]</label> Craig Gentry. _Fully Homomorphic Encryption Using Ideal Lattices_.Proceedings of the Annual ACM Symposium on Theory of Computing, 2009.

<label id="cit3">[3]</label> Koji Nuida. _Towards Constructing Fully Homomorphic Encryption without Ciphertext Noise from Group Theory_. Cryptology {ePrint} Archive, 2014. [Link](https://eprint.iacr.org/2014/097).

<label id="cit4">[4]</label> Jing Li and Licheng Wang. _Noise-Free Symmetric Fully Homomorphic Encryption
Based on Non-Commutative Rings_. Cryptology {ePrint} Archive, 2015. [Link](https://eprint.iacr.org/2015/641.pdf).

<label id="cit5">[5]</label> Kristian Gjøsteen and Martin Strand. _Can there be efficient and natural FHE
schemes?_. Cryptology {ePrint} Archive, 2016. [Link](https://eprint.iacr.org/2016/105.pdf).

<label id="cit6">[6]</label> Jing Li and Licheng Wang. _Noiseless Fully Homomorphic Encryption_. Cryptology {ePrint} Archive, 2017. [Link](https://eprint.iacr.org/2017/839.pdf).